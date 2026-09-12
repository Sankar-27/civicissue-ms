package com.civicissue.service;

import com.civicissue.entity.postgres.CategoryDepartment;
import com.civicissue.entity.postgres.Department;
import com.civicissue.entity.postgres.Issue;
import com.civicissue.entity.postgres.User;
import com.civicissue.enums.Category;
import com.civicissue.enums.IssueStatus;
import com.civicissue.enums.Priority;
import com.civicissue.enums.Role;
import com.civicissue.repository.CategoryDepartmentRepository;
import com.civicissue.repository.DepartmentRepository;
import com.civicissue.repository.IssueRepository;
import com.civicissue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeedDataService implements ApplicationRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final CategoryDepartmentRepository categoryDepartmentRepository;
    private final IssueRepository issueRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        createDefaultAdmin();
        createDefaultDepartments();
        createCategoryDepartmentMappings();
        seedSampleIssues();
    }

    private void createDefaultAdmin() {
        if (userRepository.existsByEmail("admin@civicissue.com")) {
            log.info("Default admin already exists");
            return;
        }

        User admin = User.builder()
                .name("Admin User")
                .email("admin@civicissue.com")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .enabled(true)
                .build();
        userRepository.save(admin);
        log.info("Default admin created: admin@civicissue.com");
    }

    private void createDefaultDepartments() {
        String[][] departments = {
                {"Roads & Infrastructure", "Handles road repairs, potholes, and infrastructure maintenance", "roads@civicissue.com"},
                {"Water Supply", "Manages water supply and pipe-related issues", "water@civicissue.com"},
                {"Electricity", "Handles power outages and electrical infrastructure", "electricity@civicissue.com"},
                {"Sanitation", "Manages waste disposal and cleanliness", "sanitation@civicissue.com"},
                {"Street Lighting", "Handles street light repairs and maintenance", "lighting@civicissue.com"},
                {"Drainage", "Manages drainage and sewage systems", "drainage@civicissue.com"},
                {"General", "Handles miscellaneous civic issues", "general@civicissue.com"}
        };

        for (String[] dept : departments) {
            if (departmentRepository.findByName(dept[0]).isEmpty()) {
                Department department = Department.builder()
                        .name(dept[0])
                        .description(dept[1])
                        .email(dept[2])
                        .active(true)
                        .build();
                departmentRepository.save(department);
            }
        }
        log.info("Default departments created");
    }

    private void createCategoryDepartmentMappings() {
        Category[] categories = Category.values();
        String[] departmentNames = {
                "Roads & Infrastructure",
                "Water Supply",
                "Electricity",
                "Sanitation",
                "Street Lighting",
                "Drainage",
                "General"
        };

        for (int i = 0; i < categories.length; i++) {
            Category category = categories[i];
            String departmentName = departmentNames[i];
            if (categoryDepartmentRepository.findByCategory(category).isEmpty()) {
                departmentRepository.findByName(departmentName).ifPresent(dept -> {
                    CategoryDepartment mapping = CategoryDepartment.builder()
                            .category(category)
                            .department(dept)
                            .build();
                    categoryDepartmentRepository.save(mapping);
                });
            }
        }
        log.info("Category-Department mappings created");
    }

    private void seedSampleIssues() {
        if (issueRepository.count() > 0) {
            log.info("Issues already exist, skipping seed");
            return;
        }

        if (userRepository.findByEmail("admin@civicissue.com").isEmpty()) {
            log.warn("Admin user not found, skipping issue seed");
            return;
        }

        User admin = userRepository.findByEmail("admin@civicissue.com").get();

        String[][] sampleIssues = {
                {"Pothole on Main Street", "Large pothole causing traffic issues near the central market area", "ROAD", "HIGH", "12.9716", "77.5946"},
                {"Water leak near Park Road", "Continuous water leakage from underground pipe", "WATER", "CRITICAL", "12.9740", "77.5980"},
                {"Street light not working", "Street light near the bus stop has been non-functional for 3 days", "STREETLIGHT", "MEDIUM", "12.9690", "77.5920"},
                {"Garbage overflow at sector 5", "Municipal garbage bins overflowing for the past week", "SANITATION", "HIGH", "12.9760", "77.5960"},
                {"Electric pole leaning dangerously", "Electric pole near school is leaning and poses safety risk", "ELECTRICITY", "CRITICAL", "12.9700", "77.5970"},
                {"Drainage blockage", "Storm drain completely blocked causing waterlogging", "DRAINAGE", "HIGH", "12.9730", "77.5910"},
                {"Broken footpath", "Footpath tiles broken near the hospital entrance", "ROAD", "MEDIUM", "12.9750", "77.5990"},
                {"Low water pressure", "Very low water pressure in the residential colony for 2 days", "WATER", "MEDIUM", "12.9680", "77.5930"},
                {"Flickering street lights", "Multiple street lights flickering on MG Road", "STREETLIGHT", "LOW", "12.9710", "77.5950"},
                {"Missed garbage collection", "Garbage not collected for 4 days in sector 12", "SANITATION", "HIGH", "12.9720", "77.5940"},
                {"Power outage in colony", "Frequent power cuts in the evening hours", "ELECTRICITY", "HIGH", "12.9745", "77.5975"},
                {"Sewage overflow", "Sewage water flowing onto the main road", "DRAINAGE", "CRITICAL", "12.9695", "77.5915"},
                {"Road crack developing", "Small crack on the road surface that may widen", "ROAD", "LOW", "12.9705", "77.5985"},
                {"Contaminated water supply", "Water appears yellowish and has foul smell", "WATER", "CRITICAL", "12.9755", "77.5925"},
                {"Broken street light pole", "Street light pole bent after minor accident", "STREETLIGHT", "MEDIUM", "12.9715", "77.5965"},
                {"Illegal dumping site", "Construction waste dumped on public land", "SANITATION", "HIGH", "12.9735", "77.5905"},
                {"Transformer noise", "Abnormal noise coming from local transformer", "ELECTRICITY", "CRITICAL", "12.9765", "77.5955"},
                {"Clogged drain near school", "Drain near school completely clogged with debris", "DRAINAGE", "HIGH", "12.9698", "77.5928"},
                {"Speed breaker too high", "Speed breaker near the junction is too high for vehicles", "ROAD", "MEDIUM", "12.9742", "77.5942"},
                {"Water meter malfunction", "Water meter showing incorrect readings", "WATER", "LOW", "12.9708", "77.5978"},
                {"Street light too dim", "Insufficient lighting on the footpath", "STREETLIGHT", "LOW", "12.9725", "77.5935"},
                {"Overflowing drain", "Drain overflowing during rainfall", "DRAINAGE", "HIGH", "12.9758", "77.5968"},
                {"Road accident spot", "Repeated minor accidents due to poor road design", "ROAD", "CRITICAL", "12.9685", "77.5945"},
                {"No water since morning", "Entire block has no water supply since 6 AM", "WATER", "HIGH", "12.9738", "77.5998"},
                {"Damaged street light fixture", "Street light fixture broken, wires exposed", "STREETLIGHT", "HIGH", "12.9712", "77.5922"},
                {"Need more dustbins", "Area lacks adequate waste disposal bins", "SANITATION", "MEDIUM", "12.9748", "77.5958"},
                {"Frequent voltage fluctuations", "Voltage fluctuation damaging home appliances", "ELECTRICITY", "MEDIUM", "12.9688", "77.5938"},
                {"Stagnant water breeding mosquitoes", "Stagnant water in open area causing mosquito menace", "DRAINAGE", "HIGH", "12.9762", "77.5912"},
                {"Road cave-in risk", "Minor cave-in observed on the road shoulder", "ROAD", "CRITICAL", "12.9722", "77.5972"},
                {"Leaking water main", "Major water main leak wasting thousands of liters daily", "WATER", "CRITICAL", "12.9702", "77.5948"},
                {"Light pole fallen", "Street light pole fallen on the sidewalk", "STREETLIGHT", "CRITICAL", "12.9732", "77.5982"},
                {"Need waste segregation", "No waste segregation being followed in the area", "SANITATION", "MEDIUM", "12.9692", "77.5962"},
                {"Wiring exposed at junction box", "Electrical wiring exposed and dangerous", "ELECTRICITY", "CRITICAL", "12.9752", "77.5902"},
                {"Overflowing manhole", "Manhole cover displaced, sewage overflowing", "DRAINAGE", "CRITICAL", "12.9718", "77.5948"},
                {"Uneven road surface", "Road surface is uneven causing vehicle damage", "ROAD", "MEDIUM", "12.9746", "77.5916"},
                {"Hard water issue", "Extremely hard water causing skin problems", "WATER", "LOW", "12.9706", "77.5956"},
                {"Solar panel street light not working", "Solar panel street lights not functioning at night", "STREETLIGHT", "MEDIUM", "12.9728", "77.5908"},
                {"Animal waste on road", "Stray animal waste not being cleaned regularly", "SANITATION", "LOW", "12.9756", "77.5946"},
                {"Short circuit risk", "Water entering electrical panel during rain", "ELECTRICITY", "CRITICAL", "12.9686", "77.5976"},
                {"Storm drain collapse", "Partial collapse of storm drain structure", "DRAINAGE", "CRITICAL", "12.9736", "77.5926"},
                {"Speed breaker missing at zebra crossing", "No speed breaker near school zebra crossing", "ROAD", "HIGH", "12.9704", "77.5934"},
                {"Pipeline burst", "Underground pipeline burst causing flooding", "WATER", "CRITICAL", "12.9744", "77.5984"},
                {"Broken light arm", "Street light arm broken and hanging precariously", "STREETLIGHT", "HIGH", "12.9694", "77.5944"},
                {"Recycling bins needed", "No recycling bins in the commercial area", "SANITATION", "LOW", "12.9724", "77.5974"},
                {"Underground cable damage", "Digging work damaged underground electrical cables", "ELECTRICITY", "HIGH", "12.9714", "77.5904"},
                {"Backflow in drainage", "Drainage backflow during high tide", "DRAINAGE", "HIGH", "12.9764", "77.5954"},
                {"Crater on highway approach", "Large crater developing on highway approach road", "ROAD", "CRITICAL", "12.9684", "77.5914"},
                {"Algae in water tank", "Water tank has algae growth affecting water quality", "WATER", "HIGH", "12.9734", "77.5964"},
                {"Timings issue for street lights", "Street lights turn off too early in the morning", "STREETLIGHT", "LOW", "12.9754", "77.5924"},
                {"Plastic waste accumulation", "Plastic waste accumulating near the market", "SANITATION", "HIGH", "12.9696", "77.5936"}
        };

        ThreadLocalRandom random = ThreadLocalRandom.current();

        for (String[] data : sampleIssues) {
            Issue issue = Issue.builder()
                    .title(data[0])
                    .description(data[1])
                    .category(Category.valueOf(data[2]))
                    .priority(Priority.valueOf(data[3]))
                    .latitude(Double.parseDouble(data[4]))
                    .longitude(Double.parseDouble(data[5]))
                    .reportedBy(admin)
                    .status(IssueStatus.OPEN)
                    .build();
            issueRepository.save(issue);
        }

        log.info("Seeded {} sample issues", sampleIssues.length);
    }
}
